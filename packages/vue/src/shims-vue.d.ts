/* eslint-disable */
import { ComponentCustomProperties } from 'vue'
import { Store } from 'vuex'
declare module '*.vue' { 
  import { defineComponent } from "vue";
  const Component: ReturnType<typeof defineComponent>;
  export default Component;
}

declare global {
  import {OfflineDirectSigner} from '@cosmjs/proto-signing'
  interface Window { keplr: any; Vue: any; getOfflineSigner: (string) => OfflineDirectSigner }
}
declare module '@vue/runtime-core' {
  // Declare your own store states.
  interface State {
    [key: string]:any
  }

  interface ComponentCustomProperties {
    $store: Store<State>,
    _depsLoaded: boolean
  }
}