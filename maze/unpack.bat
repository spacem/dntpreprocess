SET OUTPUT_FOLDER=%1
SET DN_FOLDER=%2
SET DN_CMD="C:\Program Files (x86)\Java\jre1.8.0_91\bin\java" -Xmx1024m -jar dncli-1.1.jar

%DN_CMD% pak -xfe maze.js %DN_FOLDER%\*.pak %OUTPUT_FOLDER%\dnt\

%DN_CMD% dds --png -p -f %OUTPUT_FOLDER%\dnt/resource/ui/mainbar/*.dds
%DN_CMD% dds --png -p -f %OUTPUT_FOLDER%\dnt/resource/ui/skill/*.dds
%DN_CMD% dds --png -p -f %OUTPUT_FOLDER%\dnt/resource/uitemplatetexture/uit_gesturebutton.dds