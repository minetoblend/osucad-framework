export class FrameworkEnvironment {

  get antialiasPreferred() {
    if(devicePixelRatio >= 2) {
      // If the device has a high pixel density, antialiasing is not needed
      return false
    }

    return true
  }

}