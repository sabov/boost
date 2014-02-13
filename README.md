Boost 2 using webGL
==================

Clone of the [Boost2](https://itunes.apple.com/en/app/boost-2/id333191476?mt=8) game for iOS.

### Dependencies

File ```bower.json``` containes all project dependencies.

```
"dependencies": {
    "three.js": "*",
    "jquery": "~2.0.3",
    "threex.windowresize": "*",
    "threex.keyboardstate": "*",
    "ShaderLoader.js": "*",
    "threex.rendererstats": "https://github.com/jeromeetienne/threex.rendererstats/archive/master.zip",
    "threejs-stats": "*",
    "threejs-examples": "*"
}
```

### Installation

Clone repository

    git clone git://github.com/sabov/boost.git

To install a packages run:

    bower install

If you have problems with this command, please, install [Node.js](http://nodejs.org) and [Twitter Bower](http://twitter.github.com/bower/).


**Or** you can use ```gh-pages``` branch with all dependencies inside.

After installation you should setup virtual host in Apache (or other web
server).

### Browser requirements

You should use only **latest** Google Chrome or Mozilla Firefox browser.
Tested in:

* Chrome Version 32.0.1700.107
* Mozilla FireFox Version 26.0

Mac OS and Windows7
