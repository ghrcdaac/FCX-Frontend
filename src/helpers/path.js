const checkPath = () => {
  const path = new URL(window.location.href).pathname
  return path === '/fcx/goes-r-plt'
}

export {checkPath}