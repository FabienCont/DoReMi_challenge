import { RepeatWrapping, type Texture } from 'three'

export const getRepeatedTexture = (textureMap: Map<string, Texture>, texture: Texture, w?: number, h?: number) => {
  if (!w || !h) return null

  const key = `${w.toFixed(1)}_${h.toFixed(1)}`
  if (textureMap.has(key)) return textureMap.get(key)

  if (!texture) return null

  // 1 unit = 1/5th of the texture. Adjust 5 to change density.
  const DENSITY = 15

  const t = texture.clone()
  t.wrapS = RepeatWrapping
  t.wrapT = RepeatWrapping
  t.repeat.set(w / DENSITY, h / DENSITY)

  textureMap.set(key, t)
  return t
}
