# camunda-commons-ui

Common frontend / UI resources and libraries for camunda web applications:

- [cockpit](https://github.com/camunda/camunda-cockpit-ui)
- [tasklist](https://github.com/camunda/camunda-tasklist-ui)
- admin


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


### Widget tests

```sh
npm install
./node_modules/grunt-protractor-runner/node_modules/protractor/bin/webdriver-manager --chrome update
```

## License

Unless otherwise specified this project is licensed under [Apache License Version 2.0](./LICENSE).


## Authors

 - [Daniel _meyerdan_ Meyer](https://github.com/meyerdan) - [@meyerdan](http://twitter.com/meyerdan)
 - [Valentin _zeropaper_ Vago](https://github.com/zeropaper) - [@zeropaper](http://twitter.com/zeropaper)
 - [Nico _Nikku_ Rehwaldt](https://github.com/nikku) - [@nrehwaldt](http://twitter.com/nrehwaldt)
