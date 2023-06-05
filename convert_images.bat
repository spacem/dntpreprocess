SET WORKING_FOLDER=%1
SET OUTPUT_FOLDER=%2

mogrify -resize 80%% -path %OUTPUT_FOLDER% -format png %WORKING_FOLDER%\resource\ui\mainbar\*.dds
