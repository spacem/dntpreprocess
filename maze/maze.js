//======================================
// Pak/DNT related extractor/compiler
//======================================
// This file requires the following ENV vars to be set in order for it to work:
// - DN_LEVEL_CAP - The level cap
// - DN_OUT_DIR - The directory where the JSON files will be written to
// - DN_UISTRING_PATH - The location of the uistring.xml file
//======================================

var JSystem = Java.type("java.lang.System")
var JString = Java.type("java.lang.String")
var JInteger = Java.type("java.lang.Integer")
var JFile = Java.type("java.io.File")
var JHashSet = Java.type("java.util.HashSet")
var JFileOutputStream = Java.type("java.io.FileOutputStream")
var JDocumentBuilderFactory = Java.type("javax.xml.parsers.DocumentBuilderFactory")

//======================================
// Pak object filter
//======================================
var regExps = {
    dnt: /\\(skilltable_character.*|skillleveltable_character.*|skilltreetable|jobtable|playerleveltable|itemtable.*|glyphskilltable|weapontable)\.dnt$/i,
    jobicon: /^\\resource\\ui\\mainbar\\jobicon.*/i,
    skillicon: /^\\resource\\ui\\mainbar\\skillicon.*/i,
    uistring: /^\\resource\\uistring\\uistring\.xml$/i,
    uitemplatetexture: /uit_gesturebutton\.dds/i,
    skilltree: /^\\resource\\ui\\skill\\.*\.dds/i,
}

var filter = function(node) {
    for (i in regExps) {
        if (regExps[i].test(node.path) && node.zsize != 0 && node.size != 0) {
            return true
        }
    }

    return false
}

var console = { 
    log: print,
    warn: print,
    error: print
};


//======================================
console.log('DNT compiling');
//======================================
var LEVEL_CAP
var JSON_OUTPUT_DIR
var UISTRING_PATH
var skills = []
var skillLevels = []
var jobs = []
var playerLevels = []
var skillTree = []
var items = []
var weapons = []
var accumulate = function(entries, cols, file) {
    var name = file.getName()
	
	console.log('processing: ', name);
	
    if (name.startsWith("skilltable")) {
        skills = skills.concat(entries)
    } else if (name.startsWith("skilltreetable")) {
        skillTree = skillTree.concat(entries)
    } else if (name.startsWith("skillleveltable")) {
        skillLevels = skillLevels.concat(entries);
    } else if (name.startsWith("jobtable")) {
        jobs = jobs.concat(entries)
    } else if (name.startsWith("playerleveltable")) {
		console.log('*** got player levels ***');
        playerLevels = playerLevels.concat(entries)
    } else if (name.startsWith("itemtable")) {
        items = items.concat(entries)
    } else if (name.startsWith("weapontable")) {
        weapons = weapons.concat(entries)
    }
}

var compile = function() {
	
	console.log('starting compile');
	
    LEVEL_CAP = parseInt(JSystem.getenv("DN_LEVEL_CAP"))
    JSON_OUTPUT_DIR = JSystem.getenv("DN_OUT_DIR")
    UISTRING_PATH = JSystem.getenv("DN_UISTRING_PATH")

    // the backend db
    var db = {Jobs: {}, Lookup: {}, SP: [], Weapons: {}}
    var lookup = new JHashSet()
	
	console.log('get techs');

    var techs = {};
    items.forEach(function(item) {
        if (item.ExchangeType > 7 && item.ExchangeType < 11) {
            techs[item.SkillID] = item.ExchangeType;
        }
    });
	
	console.log('filter jobs');

    jobs.filter(function(job) job.Service).forEach(function(job) {
        // fix a few things
        job.MaxSPJob1 = Number(job.MaxSPJob1.toFixed(3))
        job.EnglishName = job.EnglishName.toLowerCase()

		// console.log('set up job ', job.PrimaryID);
        //================================================
        // SETUP JOB WITH PRIMARY ID
        //================================================
        db.Jobs[job.PrimaryID] = {
            EnglishName: job.EnglishName,
            ParentJob: job.ParentJob,
            JobNumber: job.JobNumber,
            JobName: job.JobName,
            IconRow: parseInt(job.JobIcon / 9),
            IconCol: job.JobIcon % 9,
            SkillTree: [],
            Skills: {},
            LookupSet: [],
            Techs: {Necklace: [], Earring: [], Ring: [], Weapon: [], Crest: []}
        }

        // add name lookup set
        lookup.add(int(job.JobName))

        if (job.JobNumber == 2 && db.SP.length == 0) {
            db.SP = [job.MaxSPJob0, job.MaxSPJob1, job.MaxSPJob2]
        }

		// console.log('set up skill tree ');
        //================================================
        // SETUP SKILLTREE
        //================================================
        jobSkills = skills.filter(function(s) s.NeedJob == job.PrimaryID)
        jobSkillsID = jobSkills.map(function(s) s.PrimaryID)
        jobSkillTree = skillTree.filter(function(t) jobSkillsID.indexOf(t.SkillTableID) > -1)
        jobSkillTreeIDs = jobSkillTree.map(function(t) t.SkillTableID)
        jobSkillTree.filter(function(t) jobSkillsID.indexOf(t.SkillTableID) > -1).forEach(function(t) {
            if(t.AwakenForceLevel) {
              if(!db.Jobs[job.PrimaryID].AwakenSkillTree) {
                db.Jobs[job.PrimaryID].AwakenSkillTree = [];
              }
              db.Jobs[job.PrimaryID].AwakenSkillTree[t.TreeSlotIndex] = t.SkillTableID;
            }
            else {
              db.Jobs[job.PrimaryID].SkillTree[t.TreeSlotIndex] = t.SkillTableID
            }

            // setup initial Skills with job sp req
            db.Jobs[job.PrimaryID].Skills[t.SkillTableID] = {}

            if (t.NeedBasicSP1 + t.NeedFirstSP1 + t.NeedSecondSP1 > 0) {
                db.Jobs[job.PrimaryID].Skills[t.SkillTableID].NeedSP = [t.NeedBasicSP1, t.NeedFirstSP1, t.NeedSecondSP1]
            }


            var skill = db.Jobs[job.PrimaryID].Skills[t.SkillTableID]

            // setup parent skills
            if (t.ParentSkillID1 + t.ParentSkillID2 + t.ParentSkillID1 != 0) {
                skill.ParentSkills = {}
                skill.ParentSkills[t.ParentSkillID1] = t.NeedParentSkillLevel1
                skill.ParentSkills[t.ParentSkillID2] = t.NeedParentSkillLevel2
                skill.ParentSkills[t.ParentSkillID3] = t.NeedParentSkillLevel3
                delete skill.ParentSkills[0]
            }
        })

        // ensure sizes are always 24
        if (db.Jobs[job.PrimaryID].SkillTree.length < 24) {
            for (var i = db.Jobs[job.PrimaryID].SkillTree.length; i < 24; i++) {
                db.Jobs[job.PrimaryID].SkillTree.push(null)
            }
        }

        var newSkillTree = []
        var st = db.Jobs[job.PrimaryID].SkillTree
        for (var i = 0; i < 24; i += 4) {
            newSkillTree.push([st[i], st[i+1], st[i+2], st[i+3]])
        }

        db.Jobs[job.PrimaryID].SkillTree = newSkillTree

        
        // ensure sizes are always 24 - for awaken
        if (db.Jobs[job.PrimaryID].AwakenSkillTree) {
          if (db.Jobs[job.PrimaryID].AwakenSkillTree.length < 24) {
              for (var i = db.Jobs[job.PrimaryID].AwakenSkillTree.length; i < 24; i++) {
                  db.Jobs[job.PrimaryID].AwakenSkillTree.push(null)
              }
          }
  
          newSkillTree = []
          st = db.Jobs[job.PrimaryID].AwakenSkillTree
          for (var i = 0; i < 24; i += 4) {
              newSkillTree.push([st[i], st[i+1], st[i+2], st[i+3]])
          }
  
          db.Jobs[job.PrimaryID].AwakenSkillTree = newSkillTree;
        }

		// console.log('set up skill levels');
        //================================================
        // SETUP SKILLEVELS
        //================================================
        jobSkills.filter(function(s) jobSkillTreeIDs.indexOf(s.PrimaryID) > -1).forEach(function(s) {
            var levels = skillLevels.filter(function(l) l.SkillIndex == s.PrimaryID)
            var skill = db.Jobs[job.PrimaryID].Skills[s.PrimaryID]
            skill.NameID = s.NameID
            skill.MaxLevel = s.MaxLevel
            skill.SPMaxLevel = s.SPMaxLevel
            skill.SkillType = s.SkillType
            skill.DurationType = s.DurationType
            skill.LevelLimit = []
            skill.SkillPoint = []
            skill.DelayTime = [[], []]
            skill.DecreaseSP = [[], []]
            skill.SkillExplanationID = [[], []]
            skill.SkillExplanationIDParam = [[], []]

            // sprite stuff
            skill.Sprite = JString.format("%1$02d", int((s.IconImageIndex / 200) + 1))
            skill.IconRow = parseInt((s.IconImageIndex % 200) / 10)
            skill.IconCol = s.IconImageIndex % 10

            lookup.add(int(s.NameID))
            db.Jobs[job.PrimaryID].LookupSet.push(s.NameID)

            if (s.Element != -1) {
                skill.Element = s.Element
            }

            if (s.SkillGroup > 0) {
                skill.SkillGroup = s.SkillGroup
            }

            if (s.BaseSkillID > 0) {
                skill.BaseSkillID = s.BaseSkillID
            }

            // weapons can be uncommon + order doesn't matter
            if (s.NeedWeaponType1 > -1 || s.NeedWeaponType2 > -1) {
                skill.NeedWeaponType = []
                if (s.NeedWeaponType1 > -1) {
                    skill.NeedWeaponType.push(s.NeedWeaponType1)
                }

                if (s.NeedWeaponType2 > -1) {
                    skill.NeedWeaponType.push(s.NeedWeaponType2)
                }
            }

            switch (techs[s.PrimaryID]) {
                case 8:  db.Jobs[job.PrimaryID].Techs.Necklace.push(s.PrimaryID); break;
                case 9:  db.Jobs[job.PrimaryID].Techs.Earring.push(s.PrimaryID); break;
                case 10: db.Jobs[job.PrimaryID].Techs.Ring.push(s.PrimaryID); break;
            }

            levels.filter(function(l) l.SkillLevel > 0 && l.SkillLevel <= s.MaxLevel).forEach(function(l) {
                var lvlIndex = l.SkillLevel - 1
                var globalCoolTime = s.GlobalCoolTimePvE


                if (l.ApplyType == 0) { // PvE
                    skill.LevelLimit[lvlIndex] = l.LevelLimit // required level
                    skill.SkillPoint[lvlIndex] = l.NeedSkillPoint
                } else { // PvP
                    globalCoolTime = s.GlobalCoolTimePvP
                }

                skill.DelayTime[l.ApplyType][lvlIndex] = globalCoolTime ? globalCoolTime : l.DelayTime // cooldown
                skill.DecreaseSP[l.ApplyType][lvlIndex] = l.DecreaseSP // really is MP...
                skill.SkillExplanationID[l.ApplyType][lvlIndex] = l.SkillExplanationID
                skill.SkillExplanationIDParam[l.ApplyType][lvlIndex] = l.SkillExplanationIDParam

                // add uistring
                lookup.add(int(l.SkillExplanationID))
                if (db.Jobs[job.PrimaryID].LookupSet.indexOf(l.SkillExplanationID) == -1) {
                    db.Jobs[job.PrimaryID].LookupSet.push(l.SkillExplanationID)
                }
                if (l.SkillExplanationIDParam) {
                    l.SkillExplanationIDParam.split(",").forEach(function(param) {
                        if (param.startsWith("{") && param.endsWith("}")) {
                            var uistringID = parseInt(param.substring(1, param.length - 1))
                            if (db.Jobs[job.PrimaryID].LookupSet.indexOf(uistringID) == -1) {
                                db.Jobs[job.PrimaryID].LookupSet.push(uistringID)
                            }
                            lookup.add(int(uistringID))
                        }
                    })
                }
            })

            // weapon techs
            if (techs[s.PrimaryID]) {
                if (! job.JobNumber) { // all base jobs CAN have this tech'd
                    db.Jobs[job.PrimaryID].Techs.Weapon.push(s.PrimaryID);
                }
            }

            if (techs[s.PrimaryID] && skill.LevelLimit[0] <= 16 && db.Jobs[job.PrimaryID].Techs.Weapon.indexOf(s.PrimaryID) == -1) {
                db.Jobs[job.PrimaryID].Techs.Weapon.push(s.PrimaryID);
            }

            // add crest techs
            if (s.SPMaxLevel) {
                db.Jobs[job.PrimaryID].Techs.Crest.push(s.PrimaryID);
            }
        })
    })

	// console.log('set up plater levels');
    //================================================
    // SETUP PLAYER LEVELS (SP GAIN PER LEVEL)
    //================================================
    db.Levels = playerLevels.filter(function(p) p.PrimaryID <= LEVEL_CAP).map(function(p) p.SkillPoint)
	// db.Levels = playerLevels.filter(function(p) true).map(function(p) p.SkillPoint)
	
	// console.log('set up wep types');
    //================================================
    // SETUP THE WEAPON TYPE TO NAME ID MAPPING
    //================================================
    items.filter(function(i) i.NameID == 1000006853 && i.LevelLimit == 1)
        .reduce(function(p,c) {
            var find = p.filter(function(_p) _p.NameIDParam == c.NameIDParam)
            if (find.length == 0) {
                p.push(c)
            }
            return p
        }, [])
        .forEach(function(i) {
            var weapon = weapons.filter(function(w) w.PrimaryID == i.PrimaryID)[0]
            db.Weapons[weapon.EquipType] = i.NameIDParam.substring(1, i.NameIDParam.length - 1)
            lookup.add(int(db.Weapons[weapon.EquipType]))
        })

	// console.log('set up lookuo');
    //================================================
    // SETUP THE LOOKUP TABLE
    //================================================
    var uistringFile = new JFile(UISTRING_PATH)
    var document = JDocumentBuilderFactory.newInstance().newDocumentBuilder().parse(uistringFile)
	console.log('parsed uistring');
    document.getDocumentElement().normalize()
    var nodes = document.getElementsByTagName("message")
    var nodesLength = nodes.getLength()
	console.log('building lookup');
    for (var i = 0; i < nodesLength; i++) {
        var e = nodes.item(i)
        var mid = int(e.getAttribute("mid"))
        if (lookup.contains(mid)) {
            db.Lookup[mid] = e.getFirstChild().getData()
        }
    }


	console.log('translate');
    //================================================
    // TRANSLATE JOB NAME ID TO ACTUAL NAME
    //================================================
    for (jobID in db.Jobs) {
        db.Jobs[jobID].JobName = db.Lookup[db.Jobs[jobID].JobName]
    }


    //================================================
    // TRANSLATE WEAPON NAME ID TO ACTUAL NAME
    //================================================
    for (weapType in db.Weapons) {
        db.Weapons[weapType] = db.Lookup[db.Weapons[weapType]]
    }

	console.log('cluient data');
    //================================================
    // SETUP ALL NECESSARY DATA FOR CLIENT SIDE
    //================================================
    for (jobID in db.Jobs) {
        var job = db.Jobs[jobID]
        if (job.JobNumber == 2) {
            var json = {Skills: {}, Lookup: {}, Weapons: {}, Techs: {}}
            var parentJob = db.Jobs[job.ParentJob]
            var baseJob = db.Jobs[parentJob.ParentJob]; // need to separate from next line
            [baseJob, parentJob, job].forEach(function(j) {
                for (skillID in j.Skills) {
                    var skill = j.Skills[skillID]
                    json.Skills[skillID] = skill
                    if (skill.NeedWeaponType) {
                        skill.NeedWeaponType.forEach(function(weapType) {
                            json.Weapons[weapType] = db.Weapons[weapType]
                        });
                    }
                }

                for (l in j.LookupSet) {
                    json.Lookup[j.LookupSet[l]] = db.Lookup[j.LookupSet[l]]
                }
            })

            write(job.EnglishName, json)
        }
    }

	console.log('delete');
    //================================================
    // DELETE UNNECESSARY DATA FROM DB
    //================================================
    delete db.Weapons
    for (jobID in db.Jobs) {
        delete db.Jobs[jobID].LookupSet
    }

	console.log('write');
    write("db", db)
}

var int = function($) new JInteger(parseInt($))

var write = function(path, json) {
    var out = new JFileOutputStream(new JFile(JSON_OUTPUT_DIR, path + ".json"))
    out.write(JSON.stringify(json).getBytes("UTF-8"))
    out.close()
}
