These are scripts that I run to deploy files for dngearsim and dntviewer.

# Requirements:
* Node.js 16

# First
> `npm ci`

# Processing Files Extracted From Paks

Run these two scripts to process dnt and images files. Pass in the root of the extracted pak files and the folder that will be uploaded to hosting.

eg.
```
npm run process d:\extracted_paks d:\hosted_files\public
convert_images d:\extracted_paks d:\hosted_files\public
```
If I didn't provide a way for you to give the files ask on discord or feel free to host yourself and create a PR to add/update your region

# Processing PAKs and Everything Else
The process I use to do updates
* Install the netlify CLI and create a netlify account (other hosting can be used no problem just update update.bat)
* Create a working folder to extract pak files to
* Create a folder to hold hosted files
* Copy the _headers file to the hosted files folder
* Run `update.bat [DN_FOLDER] [WORKING_FOLDER] [HOSTED_FILES_FOLDER`
* See the file update_na.bat for an example
* Follow the prompts

Ask on discord or create a PR to add/update your region in the gearsim.

# Individual Scripts

## Extract dnt files
Pass in the dn folder and working folder. It's just calling quickbms in a flaky way
> `bms_unpack D:\games\DragonNest d:\working`

## Process images
Pass in the working folder and the output folder. It uses mogrify from ImageMagick to convert and shrink the files.
> `convert_images D:\games\working d:\output`

## Process DNT and Translation Files
Pass in the working folder and the output folder
> `npm run process d:\working d:\output`

## Upload files to netlify
Pass in the output folder
> `npm run upload d:\output`
