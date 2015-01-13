# camunda commons styling

## Best practices

In your project, you should use a `_vars.less` file which imports the
`common-variables.less` of this project.

```less
// note: you may need to adapt this path depending on where your `_vars.less` is
@import "node_modules/camunda-commons-ui/resources/less/common-variables";

// override the default `@brand-primary` color defined in `common-variables.less`
@brand-primary: #7fa;

// add custom variables for your project
@custom-variable: 10px;
```

Then, you will have a `styles.less` (which will probably be compiled as `styles.css`).

```less
@import "_vars";

// adapt the path if / as needed
@import "node_modules/camunda-commons-ui/resources/less/bootstrap";
```
