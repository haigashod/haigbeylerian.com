# haigbeylerian.com

Static site — no build step, no dependencies, no frameworks. Pure HTML/CSS/JS.

## File Structure

```
/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── main.js
└── img/                ← YOU SUPPLY THESE
    ├── hero.jpg        (homepage full-bleed — landscape, min 1600px wide)
    ├── about.jpg       (portrait/half-page — min 800px wide)
    ├── solo-guitar.jpg (album cover)
    ├── armenian-vol1.jpg
    └── armenian-vol2.jpg
```

## Images

The site references images from `img/`. You supply your own:
- `hero.jpg` — the live shot on the yellow stage background works great
- `about.jpg` — the black-and-white guitar portrait
- Album covers — export from your existing files

All images should be JPG, optimized. Use Squoosh (squoosh.app) to compress before uploading.

## Deploying to GitHub Pages

1. Create a new GitHub repo named exactly: `haigbeylerian.com`
2. Upload all files (drag & drop in the GitHub web interface, or git push)
3. Go to Settings → Pages → Source: Deploy from branch → main → / (root) → Save
4. Your site will be live at `https://haigbeylerian.github.io/haigbeylerian.com/` within ~60 seconds

## Connecting Your Domain

After transferring domain from Squarespace to Namecheap:

1. In GitHub Pages settings, set Custom Domain to `haigbeylerian.com`
2. In Namecheap DNS, add these records:
   ```
   A    @    185.199.108.153
   A    @    185.199.109.153
   A    @    185.199.110.153
   A    @    185.199.111.153
   CNAME www  haigbeylerian.github.io
   ```
3. Check "Enforce HTTPS" in GitHub Pages settings (free SSL)

Done. The site costs $0/year in hosting from this point forward.

## Updating Content

- Edit `index.html` directly — it's all in one file, clearly commented
- To add a new tab product: copy a `.tab-card` block and update the image, title, price, and Gumroad link
- To add a portfolio credit: copy a `.portfolio-item` block

## Your Email Address

The contact section uses `haig@haigbeylerian.com` as a placeholder.
Update it in `index.html` if your actual address is different.
