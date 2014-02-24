Webpage Preview
===============

This is a Node.js module which takes a URL to a page and renders preview images of different sizes using the PhantomJS rendering engine.

Example usage:
--------------

```javascript
webpagePreview.generatePreview('http://www.google.com/', 'google', APP_ROOT + '/public/previews', null, null, function(error, sizePaths) {
    if (error) {
        console.log(error);
    }
    else {
        console.log(sizePaths);
    }
});
```

### Sample return

`sizePaths` =

```javascript
{
  "full": "\/home\/cjdell\/Projects\/web-monitor\/public\/previews\/google\/full.png",
  "small": "\/home\/cjdell\/Projects\/web-monitor\/public\/previews\/google\/small.png",
  "medium": "\/home\/cjdell\/Projects\/web-monitor\/public\/previews\/google\/medium.png",
  "large": "\/home\/cjdell\/Projects\/web-monitor\/public\/previews\/google\/large.png"
}
```

Installation:
-------------

```
npm install webpage-preview
```
