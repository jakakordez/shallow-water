# Shallow water equations

This repository contains shallow water equations solver implemented in WebGL.

## Requirements

- Static HTTP server
- A modern web browser with WebGL 2 (Tested in Firefox 64)

## To run

Demonstration is hosted on [http://kordez.si/shallow-water/]()

## Deploy locally

Because the code uses XHR loading of shaders a proper HTTP server is required. You can run one with Python:

```
python3 -m http.server
```

and open [http://localhost:8000](http://localhost:8000) in your browser.