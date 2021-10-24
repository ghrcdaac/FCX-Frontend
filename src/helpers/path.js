import { basePath } from "../constants/enum"
const checkPath = () => {
  const path = new URL(window.location.href).pathname
  return path === basePath
}

export {checkPath}