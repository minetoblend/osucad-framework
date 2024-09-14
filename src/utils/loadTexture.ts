import { ImageSource, path, Texture, type TextureSourceOptions } from 'pixi.js';
import { LoadImageBitmapOptions, WorkerManager } from './WorkerManager.ts';

export async function loadTexture(url: string, options: TextureSourceOptions = {}, opts2: LoadImageBitmapOptions = {}): Promise<Texture | null> {
  try {
    url = path.toAbsolute(url);

    const imageBitmap = await WorkerManager.loadImageBitmap(url, undefined, opts2);

    const source = new ImageSource({
      resource: imageBitmap,
      alphaMode: 'premultiply-alpha-on-upload',
      label: url,
      resolution: 1,
      ...options,
    });

    source.once('destroy', () => imageBitmap.close());

    return new Texture({
      source,
      label: url,
    });
  } catch (error) {
    console.error('Failed to load texture', url, error);
    return null;
  }
}
