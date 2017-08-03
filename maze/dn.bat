SET DN_OUT_DIR=%2
SET DATA_PATH=%1
SET DN_CMD="C:\Program Files (x86)\Java\jre1.8.0_91\bin\java" -Xmx1024m -jar dncli-1.1.jar
SET DN_LEVEL_CAP=95
SET DNT_PATH=%DATA_PATH%
SET DN_UISTRING_PATH=%DATA_PATH%\uistring.xml


%DN_CMD% dnt -c maze.js %DNT_PATH%\*.dnt