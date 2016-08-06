SET REGION=%1
SET DNFOLER=%2
SET SKIPDNT=%3

mkdir %REGION%

IF NOT DEFINED SKIPDNT "C:\Program Files (x86)\Java\jre1.8.0_91\bin\java" -jar DNPakTool-1.0.5.jar dump -ds -fr (\.dnt^|uistring\.xml^|itemicon.*dds^|skillicon.*dds^|jobicon.*dds) C:\games\%DNFOLER%\Resource*.pak C:\games\Unpacker\%REGION%

call "C:\Program Files\nodejs\nodevars.bat"

cd C:\games\Unpacker\dntpreprocess
echo deleting files ..\firebase_%REGION%\public\*.*
del/Q ..\firebase_%REGION%\public\*.*

echo processing
node dntpreprocess.js ../%REGION%/resource/ext ../firebase_%REGION%/public
node uistringzip.js ../%REGION%/resource/uistring/uistring.xml > ../firebase_%REGION%/public/uistring.lzjson
echo getting items
node getitems.js ../firebase_%REGION%/public
echo getting ids
node getids.js ../firebase_%REGION%/public
echo getting nums
node getnums.js ../firebase_%REGION%/public

rem TODO: use mogrify to change format of images

rem pause

cd ../firebase_%REGION%
call firebase login
echo deploying
call firebase deploy


pause