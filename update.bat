@echo off

if [%1]==[] goto usage

SET UPDATE_DN_FOLDER=%1
SET UPDATE_WORKING_FOLDER=%2
SET UPDATE_OUTPUT_FOLDER=%3

@echo About to delete files in these folders:
@echo %UPDATE_WORKING_FOLDER%
@echo %UPDATE_OUTPUT_FOLDER%
pause
del/q/s %UPDATE_WORKING_FOLDER%\*.*
del/q/s %UPDATE_OUTPUT_FOLDER%\public\*.*
call bms_unpack %UPDATE_DN_FOLDER% %UPDATE_WORKING_FOLDER%
call convert_images %UPDATE_WORKING_FOLDER% %UPDATE_OUTPUT_FOLDER%\public
call npm run process %UPDATE_WORKING_FOLDER% %UPDATE_OUTPUT_FOLDER%\public
call npm run upload %UPDATE_OUTPUT_FOLDER%

goto :eof
:usage
@echo Usage: %0 [DN_FOLDER] [WORKING_FOLDER] [OUTPUT_FOLDER]
exit /B 1
