
export class ElevenLabsService {
  constructor(private readonly env: CfEnv) { }

  async buildAudioAsync(transcript: string): Promise<ArrayBuffer> {
    const data = {
      text: transcript,
    };
    const urlSuffix = `v1/text-to-speech/${this.env.ELEVENLABS_VOICE}`;
    const url = `https://gateway.ai.cloudflare.com/v1/${this.env.ACCOUNT_ID}/${this.env.AI_GATEWAY}/elevenlabs/${urlSuffix}`;

    console.log(url);
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": this.env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify(data),
    });

    if (resp.status !== 200) {
      throw new Error(
        `ElevenLabs returned status ${resp.status}: ${await resp.text()}`
      );
    }

    return await resp.arrayBuffer();
  }
}
