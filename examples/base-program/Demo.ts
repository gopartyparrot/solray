import {
  PublicKey,
  BaseProgram,
  ProgramAccount,
  Wallet,
  System,
} from "../..";

import BufferLayout from 'buffer-layout';

const NumberLayout = BufferLayout.struct([
  BufferLayout.utf8('number'),
]);

interface RequestParams {
  demoKey: PublicKey;
}

export default class Demo extends BaseProgram {
 
  public get conn() {
    return this.wallet.conn
  }
  
  public async request(pubkey) {
    return this.sendTx([
      // instructions
      this.requestInstruction({
        demoKey: pubkey
      }),
    ], [
      // signers
      this.account,
    ]);
  }

  private requestInstruction(params: RequestParams) {
    
    return this.instruction(Buffer.from('1'), [
      { write: params.demoKey },
    ]);
  }
}