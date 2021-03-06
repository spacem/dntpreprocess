SET REGION=%1
SET DNFOLDER=%2
SET SKIPDNT=%3


IF DEFINED SKIPDNT GOTO Skip

del /s/q %REGION%
mkdir %REGION%

call dntpreprocess\bms_unpack.bat %REGION% %DNFOLDER%
rem IF NOT DEFINED SKIPDNT "C:\Program Files (x86)\Java\jre1.8.0_91\bin\java" -jar DNPakTool-1.0.5.jar dump -ds -fr (\.dnt^|uistring\.xml^|itemicon.*dds^|skillicon.*dds^|jobicon.*dds) d:\games\%DNFOLDER%\Resource*.pak d:\games\Unpacker\%REGION%

:Skip

call "C:\Program Files\nodejs\nodevars.bat" %1 %2

cd d:\games\Unpacker\dntpreprocess
echo deleting files ..\firebase_%REGION%\public\*.*
del/Q ..\firebase_%REGION%\public\*.*


echo processing
node dntpreprocess.js ../%REGION%/resource/ext ../firebase_%REGION%/public
rem node uistringzip.js ../%REGION%/resource/uistring/uistring.xml > ../firebase_%REGION%/public/uistring.lzjson
node uistringzip-json.js ../%REGION%/resource/uistring/uistring.xml > ../firebase_%REGION%/public/uistring.json

echo getting items
node getitems.js ../firebase_%REGION%/public %DNFOLDER% d:\games\Unpacker\old_version_items\%REGION%
echo getting ids
node getids.js ../firebase_%REGION%/public
echo getting nums
node getnums.js ../firebase_%REGION%/public
echo getting strings
node getstrings.js ../firebase_%REGION%/public/uistring.json ../firebase_%REGION%/public


echo copy version
copy %DNFOLDER%\Version.cfg d:\games\Unpacker\firebase_%REGION%\public\

dir /b d:\games\Unpacker\firebase_%REGION%\public\*.json > d:\games\Unpacker\firebase_%REGION%\public\files.txt

echo get maze data
call maze\get_maze_data %REGION%

rem TODO: use mogrify to change format of images

rem pause

echo deploy to firebase
cd d:\games\Unpacker\firebase_%REGION%
call netlify deploy -p -d d:\games\Unpacker\firebase_%REGION%

echo if it fails run: 
echo cd d:\games\Unpacker\firebase_%REGION%
echo call netlify deploy -p -d d:\games\Unpacker\firebase_%REGION%

pause