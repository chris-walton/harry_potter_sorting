import { Buffer } from 'node:buffer';
import type { ElevenLabsService } from "./elevenlabs.service";

export class AudioService {
    constructor(private readonly elevenLabs: ElevenLabsService, private readonly kv: KVNamespace) {
    }

    async getAudio(text: string): Promise<ArrayBuffer> {
        await this.verifyAudio(text);
        const audioText = await this.kv.get<string>(text);

        return audioText ? Buffer.from(audioText, 'base64') : null;
    }

    async verifyAll(texts: string[]): Promise<void> {
        for (const text of texts) {
            await this.verifyAudio(text);
        }
    }

    async verifyAudio(text: string): Promise<void> {
        const audioText = await this.kv.get<string>(text);

        if (audioText) return;

        const audio = await this.elevenLabs.buildAudioAsync(text);
        //
        //  Turn array buffer into string
        //
        const audioString = Buffer.from(audio).toString('base64');
        await this.kv.put(text, audioString);
    }
}
