import { ImageSource, path, Texture, type TextureSourceOptions, WorkerManager } from 'pixi.js';

export async function loadTexture(url: string, options: TextureSourceOptions = {}): Promise<Texture | null> {
  try {
    url = path.toAbsolute(url);

    const imageBitmap = await WorkerManager.loadImageBitmap(url);

    const source = new ImageSource({
      resource: imageBitmap,
      alphaMode: 'premultiply-alpha-on-upload',
      label: url,
      resolution: 1,
      ...options,
    });

    return new Texture({
      source,
      label: url,
    });
  } catch (error) {
    console.error('Failed to load texture', url, error);
    return null;
  }
}
