import { EventEmitter } from 'events'
import ReconnectingWebSocket from 'reconnecting-websocket'
import axios, { AxiosPromise, AxiosResponse } from 'axios'
import { SigningStargateClient } from '@cosmjs/stargate'
import { OfflineDirectSigner, Registry } from '@cosmjs/proto-signing'
import SpClientError from './errors/SpClientError'
export interface IClientConfig {
  apiAddr: string
  rpcAddr?: string
  wsAddr?: string
  refresh?: number
  offline?: boolean
}
export type QueryParamsType = Record<string | number, unknown>
export interface IFullRequestParams {
  body?: unknown
  path: string
  query?: QueryParamsType
  method: 'GET' | 'POST' | 'PUT'
}
export interface IResponse {
  data: string
}
export interface ITypedResponse {
  type: string
}
export interface IAPIResponse {
  data: unknown
}
export interface IParsedResponse {
  data: ITypedResponse
}
export default class SPClient extends EventEmitter {
  private apiAddr: string
  private rpcAddr: string
  private wsAddr: string
  private offline: boolean
  private refresh: number
  private socket: ReconnectingWebSocket

  public signingClient
  private signer: OfflineDirectSigner
  private timer: ReturnType<typeof setInterval>

  constructor({ apiAddr, rpcAddr, wsAddr, refresh, offline }: IClientConfig) {
    super()
    this.apiAddr = apiAddr
    this.rpcAddr = rpcAddr
    this.wsAddr = wsAddr
    this.offline = offline
    this.refresh = refresh
    const poll: () => Promise<void> = this.connectivityTest.bind(this)
    this.timer = setInterval(poll, this.refresh)
    this.connectivityTest()
    if (this.wsAddr) {
      this.socket = new ReconnectingWebSocket(this.wsAddr)

      this.socket.onopen = this.onOpenWS.bind(this)
      this.socket.onmessage = this.onMessageWS.bind(this)
      this.socket.onerror = this.onErrorWS.bind(this)
      this.socket.onclose = this.onCloseWS.bind(this)
    }
  }
  public async useSigner(signer: OfflineDirectSigner): Promise<void> {
    this.signingClient = await SigningStargateClient.connectWithSigner(this.rpcAddr, signer)
    this.signer = signer
  }
  public switchAPI(apiAddr: string): void {
    this.apiAddr = apiAddr
  }
  public switchWS(wsAddr: string): void {
    this.emit('ws-status', false)
    this.wsAddr = wsAddr
    this.socket = new ReconnectingWebSocket(this.wsAddr)
  }
  public async switchRPC(rpcAddr: string): Promise<void> {
    this.rpcAddr = rpcAddr
    if (this.signingClient) {
      const registry: Registry = { ...this.signingClient.registry }
      this.signingClient = await SigningStargateClient.connectWithSigner(this.rpcAddr, this.signer, { registry })
    }
  }
  private async connectivityTest(): Promise<void> {
    if (this.offline) {
      this.emit('newblock', { dummy: true })
    }
    if (this.apiAddr) {
      try {
        const status = await axios.get(this.apiAddr + '/node_info')
        this.emit('chain-id', status.data.node_info.network)
        status.data.application_version.name
          ? this.emit('chain-name', status.data.application_version.name)
          : this.emit('chain-name', status.data.node_info.network)
        this.emit('api-status', true)
      } catch (error) {
        if (!error.response) {
          this.emit('api-status', false)
          console.error(new SpClientError('Client-js:API', 'API Node unavailable'))
        } else {
          this.emit('api-status', true)
        }
      }
    }
    if (this.rpcAddr) {
      try {
        await axios.get(this.rpcAddr)
        this.emit('rpc-status', true)
      } catch (error) {
        if (!error.response) {
          console.error(new SpClientError('Client-js:API', 'RPC Node unavailable'))
          this.emit('rpc-status', false)
        } else {
          this.emit('rpc-status', true)
        }
      }
    }
  }
  private onErrorWS(): void {
    console.error(new SpClientError('Client-js:WS', 'Could not connect to websocket.'))
  }
  private onCloseWS(): void {
    this.emit('ws-status', false)
  }
  private onOpenWS(): void {
    this.emit('ws-status', true)
    this.socket.send(
      JSON.stringify({
        jsonrpc: '2.0',
        method: 'subscribe',
        id: '1',
        params: ["tm.event = 'NewBlock'"],
      }),
    )
  }
  private onMessageWS(msg: IResponse): void {
    const result: IParsedResponse = JSON.parse(msg.data).result
    if (result.data && result.data.type === 'tendermint/event/NewBlock') {
      this.emit('newblock', JSON.parse(msg.data).result)
    }
  }
  public async query(url: string, params = ''): Promise<unknown> {
    try {
      const response: IAPIResponse = await axios.get(this.apiAddr + url + params)
      return response.data
    } catch (e) {
      console.error(new SpClientError('Client-js:API', 'Could not access API: ' + url))
    }
  }

  private addQueryParam(query: QueryParamsType, key: string): string {
    const value: unknown = query[key]

    return (
      encodeURIComponent(key) +
      '=' +
      encodeURIComponent(Array.isArray(value) ? value.join(',') : typeof value === 'number' ? value : `${value}`)
    )
  }
  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query: QueryParamsType = rawQuery || {}
    const keys: string[] = Object.keys(query).filter((key) => 'undefined' !== typeof query[key])
    return keys
      .map((key) =>
        typeof query[key] === 'object' && !Array.isArray(query[key])
          ? this.toQueryString(query[key] as QueryParamsType)
          : this.addQueryParam(query, key),
      )
      .join('&')
  }
  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString: string = this.toQueryString(rawQuery)
    return queryString ? `?${queryString}` : ''
  }
  public async request<T = unknown>({ body, path, query, method }: IFullRequestParams): Promise<AxiosResponse<T>> {
    const url: string = this.apiAddr + path + this.addQueryParams(query)
    try {
      const response: AxiosPromise<T> = axios({
        url,
        method,
        data: body,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json;charset=UTF-8',
        },
      })
      const data: AxiosResponse<T> = await response
      return data
    } catch (e) {
      console.error(new SpClientError('Client-js:API', 'Could not access API: ' + url))
    }
  }
}
