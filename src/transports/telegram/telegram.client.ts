import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';

export class TelegramClient extends ClientProxy {
  async connect(): Promise<any> {}

  async close() {}
  // eslint-disable-next-line @typescript-eslint/require-await
  async dispatchEvent<T = any>(_packet: ReadPacket): Promise<T> {
    return undefined as unknown as T;
  }

  publish(_packet: ReadPacket, _callback: (packet: WritePacket) => void) {
    return () => void undefined;
  }

  unwrap<T = never>(): T {
    throw new Error('Method not implemented.');
  }
}
