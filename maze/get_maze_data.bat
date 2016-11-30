SET REGION=%1
SET DNFOLDER=%2

mkdir C:\games\Unpacker\%REGION%\maze
mkdir C:\games\Unpacker\firebase_%REGION%
mkdir C:\games\Unpacker\firebase_%REGION%\public
mkdir C:\games\Unpacker\firebase_%REGION%\public\maze

rem call C:\games\Unpacker\dntpreprocess\maze\unpack.bat C:\games\Unpacker\%REGION%\maze %DNFOLDER%
copy C:\games\Unpacker\%REGION%\resource\uistring\uistring.xml C:\games\Unpacker\%REGION%\maze\

rem copy these then remove some so we dont get out of memory
copy C:\games\Unpacker\%REGION%\resource\ext\*.dnt C:\games\Unpacker\%REGION%\maze
del C:\games\Unpacker\%REGION%\maze\enchant*.dnt
del C:\games\Unpacker\%REGION%\maze\potential*.dnt
del C:\games\Unpacker\%REGION%\maze\monster*.dnt
del C:\games\Unpacker\%REGION%\maze\parts*.dnt
del C:\games\Unpacker\%REGION%\maze\cash*.dnt
del C:\games\Unpacker\%REGION%\maze\skillleveltable_prefix*.dnt

cd C:\games\Unpacker\dntpreprocess\maze
call dn.bat C:\games\Unpacker\%REGION%\maze C:\games\Unpacker\firebase_%REGION%\public\maze
