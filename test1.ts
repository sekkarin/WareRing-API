abstract class Webhook {
  data: any[];
  queryString: string;

  constructor(data: any[], queryString: string) {
    this.data = data;
    this.queryString = queryString;
  }
}
class Curl {
  //
  private ch: any;
  init(setOpt: any) {
    console.log('init', setOpt);
    return (this.ch = setOpt);
  }

  exec(ch: any) {
    this.ch = '....' + ch;
    return {
      choices: '1',
      message: 'hello world',
    };
  }
}

// Move Method
class WebHook1 extends Webhook {
  private apiKey: string;
  constructor(
    apiKey: string,
    data: any[],
    queryString: string,
    private readonly curl: Curl,
  ) {
    super(data, queryString);
    this.apiKey = apiKey;
  }
//   Extract Method
  callAI() {
    const ch = this.curl.init({ setOpt: 'setOpt', apiKey: this.apiKey });
    return this.curl.exec(ch);
  }
//   Extract Method
  showResponse() {
    try {
        // Inline Method
      const result = this.callAI();
      console.log(result.choices, result.message);
    } catch (error) {
      throw new Error('Error not response' + error?.message);
    }
  }
}
const apiKey = '___';
const data = [{ message: '123' }];
const queryString = 'dog';

const webhook1 = new WebHook1(apiKey, data, queryString, new Curl());
webhook1.showResponse();
