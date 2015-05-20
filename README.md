# camunda-commons-ui

Common frontend / UI resources and libraries for camunda web applications:

- [admin][admin]
- [cockpit][cockpit]
- [tasklist][tasklist]

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
- (`widgets`)[#widgets]


## Test

To test the components install karma via

```sh
npm install -g karma-cli
npm install
```

and execute the test suite via

```sh
karma start test/karma.conf.js
```


### Widgets

Widgets are reusable components which should be easy to integrate in the Camunda webapps ([admin][admin], [cockpit][cockpit] and [tasklist][tasklist]) and your own projects.

#### Available widgets

- `cam-widget-bpmn-viewer`
- `cam-widget-debug`
- `cam-widget-footer`
- `cam-widget-header`
- `cam-widget-inline-field`
- `cam-widget-loader`
- `cam-widget-search`
- `cam-widget-search-pill`
- `cam-widget-variable`

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


## License

Unless otherwise specified this project is licensed under [Apache License Version 2.0](./LICENSE).


## Authors

 - [Daniel _meyerdan_ Meyer](https://github.com/meyerdan) - [@meyerdan](http://twitter.com/meyerdan)
 - [Valentin _zeropaper_ Vago](https://github.com/zeropaper) - [@zeropaper](http://twitter.com/zeropaper)
 - [Nico _Nikku_ Rehwaldt](https://github.com/nikku) - [@nrehwaldt](http://twitter.com/nrehwaldt)


[admin][//github.com/camunda/camunda-admin-ui]
[cockpit][//github.com/camunda/camunda-cockpit-ui]
[tasklist][//github.com/camunda/camunda-tasklist-ui]
