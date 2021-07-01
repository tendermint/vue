# `@starport/vue`

A collection of Vue 3 components to help build [Starport](http://github.com/tendermint/starport) front-end applications.

## Install

Assuming you have a Vue 3 project, just run:

```
npm install --save @starport/vue
```

The components also require `@starport/vuex` to be installed which is set as a peer dependency. More information [here](https://github.com/tendermint/vue/tree/develop/packages/vuex)

## Usage

If you want to import the entire library, in your `main.js` file:

```js
import { createApp } from 'vue'
import App from './App.vue'
import store from './store' // See @starport/vuex documentation
import vueLib from '@starport/vue'

const app = createApp(App)
app.config.globalProperties._depsLoaded = true
app.use(store).use(vueLib).mount('#app')
```

You can also import only specific components in your `main.js` file:

```js
import { createApp } from 'vue'
import App from './App.vue'
import store from './store' // See @starport/vuex documentation
import { SpTokenSend } from '@starport/vue'

const app = createApp(App)
app.config.globalProperties._depsLoaded = true
app.use(store).use(SpTokenSend).mount('#app')
```

## Components

...