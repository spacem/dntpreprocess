SET REGION=%1
SET DNFOLDER=%2

mkdir d:\games\Unpacker\%REGION%\maze
mkdir d:\games\Unpacker\firebase_%REGION%
mkdir d:\games\Unpacker\firebase_%REGION%\public
mkdir d:\games\Unpacker\firebase_%REGION%\public\maze

rem call d:\games\Unpacker\dntpreprocess\maze\unpack.bat d:\games\Unpacker\%REGION%\maze %DNFOLDER%
copy d:\games\Unpacker\na\resource\uistring\uistring.xml d:\games\Unpacker\%REGION%\maze\

rem copy these then remove some so we dont get out of memory
copy d:\games\Unpacker\%REGION%\resource\ext\*.dnt d:\games\Unpacker\%REGION%\maze
del d:\games\Unpacker\%REGION%\maze\enchant*.dnt
del d:\games\Unpacker\%REGION%\maze\potential*.dnt
del d:\games\Unpacker\%REGION%\maze\monster*.dnt
del d:\games\Unpacker\%REGION%\maze\parts*.dnt
del d:\games\Unpacker\%REGION%\maze\cash*.dnt
del d:\games\Unpacker\%REGION%\maze\skillleveltable_prefix*.dnt

cd d:\games\Unpacker\dntpreprocess\maze
call dn.bat d:\games\Unpacker\%REGION%\maze d:\games\Unpacker\firebase_%REGION%\public\maze
