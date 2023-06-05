These are scripts that I run to deploy files for dngearsim and dntviewer.

# Requirements:
* Node.js 16
* Netlify CLI (to deploy to netlify)

# First
> `npm ci`

## Extract dnt files
Pass in the dn folder and working folder
> `npm run extract D:\games\DragonNest d:\working`

## Clean output folder
To delete files in output folder
> `npm run clean_output d:\working`

## Process images
Pass in the working folder and the output folder
> `npm run process_images D:\games\working d:\output`

## Process files
Pass in the working folder and the output folder
> `npm run process d:\working d:\output`

## Upload files to netlify
Pass in the output folder
> `npm run upload d:\output`

## Do the lot
> `update D:\games\DragonNest D:\working D:\output`
