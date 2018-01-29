These are scripts that I run to deploy files for dngearsim, dnskillsim and dntviewer.
Probably needs some tweaking if others want to use to deploy their own regions but you might be able to bumble through from this rough guide.

Before you start you need
* Node.js
* netlify cli
* Java in C:\Program Files (x86)\Java\jre1.8.0_91\bin\java
* The folder C:\games\Unpacker
* A netlify account

In theory you just need to copy all files in this repository (git clone or download the zip) to C:\games\Unpacker\dntpreprocess Then run extract.bat and pass two parameters. The region and the folder where the game is installed.

For a full deployment you need a netlify account. Make a folder called firebase_region and copy the contents of the firebase_xxx folder into that folder.


For example I have a batch file called extract_eu.bat in c:\games\unpacker with this single line:
call dntpreprocess\extract.bat eu Z:\games\DragonNestEurope

I have a copy of the firebase_xxx folder that is called c:\games\unpacker\firebase_eu\

extract.bat unpacks to C:\games\Unpacker\eu then optimised files are written to c:\games\unpacker\firebase_eu\public
extract.bat then logs into netlify and uploads the optimised files

For completeness there is one last step which is to add the region to regionService.js in the gear and skill sims.