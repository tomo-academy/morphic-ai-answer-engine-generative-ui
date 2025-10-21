# TOMO AI BUDDY Logo Setup Instructions

## Required Logo Files

The TOMO AI BUDDY logo needs to be added to the following locations:

### 1. Favicon (app/favicon.ico)
- Download the logo from: https://z-cdn-media.chatglm.cn/files/27f21a9b-6618-429f-a0ff-b942b6472bed_image_1760449128343.jpeg?auth_key=1760962879-e08344068a7a4d92af64a1b49af40786-0-548904464eea7cc84a5ea84aaf937fc7
- Convert it to .ico format (16x16, 32x32, 48x48 sizes)
- Replace the existing `app/favicon.ico` file

### 2. OpenGraph Image (app/opengraph-image.png)
- Use the same logo image
- Resize to 1200x630 pixels for optimal social media sharing
- Replace the existing `app/opengraph-image.png` file

### 3. Public Images Directory
- Save the original logo as `public/images/tomo-logo.png` or `public/images/tomo-logo.jpeg`
- This can be used for various UI components that need the logo

### 4. Icon Component
- The app uses an `IconLogo` component from `@/components/ui/icons`
- You may want to update this component to display the TOMO AI BUDDY logo instead of the current icon

## Quick Setup Commands (after downloading the logo)

```bash
# If you have the logo file downloaded as tomo-logo.jpeg:

# Convert to different formats as needed
# For favicon, you can use online converters or tools like ImageMagick:
# magick convert tomo-logo.jpeg -resize 32x32 app/favicon.ico

# For OpenGraph image:
# magick convert tomo-logo.jpeg -resize 1200x630 app/opengraph-image.png

# Copy to public images
cp tomo-logo.jpeg public/images/tomo-logo.jpeg
```

## Note
The original logo URL was not accessible during setup, so manual download and placement is required.