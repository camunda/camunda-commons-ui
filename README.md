# camunda-commons-ui

Common frontend / UI resources and libraries for camunda web applications:

- [admin][admin]
- [cockpit][cockpit]
- [tasklist][tasklist]

> **Important note:**
> This project is used internally and the API of its components are subject to changes at any time.

## Content

- `lib`
  - `auth` - for authentication mechanisms and tools, [read more](./lib/auth/README.md)
  - `util` - commonly used utilities [read more](./lib/util/README.md)
  - `directives`
  - `pages`
  - `plugin`
  - `resources`
  - `search`
  - `services`
- `resources`
  - `locales` - translation files
  - `img`
  - `less` - base less files to generate CSS stylesheets
- [`widgets`](#widgets)


### Widgets

Widgets are reusable components which should be easy to integrate in the Camunda webapps ([admin][admin], [cockpit][cockpit] and [tasklist][tasklist]) and your own projects.

#### Usage

A good way to get familiar with the widgets integration in your projects is by reading the source code of the `lib/widgets/*/test/*.spec.html` or their online versions (see the _widgets_ menu on the [GitHub page](//camunda.github.io/camunda-commons-ui)).   
In those examples, we use uncompiled versions of the library and its dependencies and wire the whole with [requirejs](//requirejs.org).


#### Available widgets

- `cam-widget-bpmn-viewer`
- `cam-widget-cmmn-viewer`
- `cam-widget-dmn-viewer`
- `cam-widget-debug`
- `cam-widget-footer`
- `cam-widget-header`
- `cam-widget-inline-field`
- `cam-widget-loader`
- `cam-widget-search`
- `cam-widget-search-pill`
- `cam-widget-variable`
- `cam-widget-variables-table`
- `cam-widget-clipboard`
- `cam-widget-var-template`

#### Developing the widgets

```sh
grunt auto-build
```

#### Testing the widgets

```sh
npm install
./node_modules/grunt-protractor-runner/node_modules/protractor/bin/webdriver-manager --chrome update
grunt
```

While developing widgets, you may want to run the tests as a change occurs, here is a way to achieve that:
```sh
npm install -g nodemon
nodemon -w lib/widgets/ --exec "protractor ./test/protractor.conf.js"
```

You can also run the tests on a single widget like that:
```
TESTED=variable nodemon -w lib/widgets/ --exec "protractor ./test/protractor.conf.js"
```
This will only run the `cam-widget-variable` tests.



## Test

```sh
grunt karma
```



## License

Unless otherwise specified this project is licensed under [Apache License Version 2.0](./LICENSE).


## Authors

 - [Daniel _meyerdan_ Meyer](https://github.com/meyerdan) - [@meyerdan](http://twitter.com/meyerdan)
 - [Valentin _zeropaper_ Vago](https://github.com/zeropaper) - [@zeropaper](http://twitter.com/zeropaper)
 - [Nico _Nikku_ Rehwaldt](https://github.com/nikku) - [@nrehwaldt](http://twitter.com/nrehwaldt)
 - [Sebastian Stamm](https://github.com/SebastianStamm) - [@seb_stamm](https://twitter.com/seb_stamm)


[admin]: https://github.com/camunda/camunda-admin-ui
[cockpit]: https://github.com/camunda/camunda-cockpit-ui
[tasklist]: https://github.com/camunda/camunda-tasklist-ui
