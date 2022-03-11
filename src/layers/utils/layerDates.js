export const getLayerDate = (date, deliminator='-') => {
  const tokens = date.split(deliminator)
  const temp = tokens[1]
  tokens[1] = tokens[2]
  tokens[2] = temp
  return tokens.reverse().join('')
}

export const getDateString = (date, deliminator='-') => {
  return date.split(deliminator).join('')
}

export const compareDate = (d1, d2, deliminator='-') => {
  const dtoi = (date) => {
    const tokens = date.split(deliminator)
    return 10000*(+tokens[0])+100*(+tokens[1]) + (+tokens[2]);
  }
  const i_d1 = dtoi(d1)
  const i_d2 = dtoi(d2)

  return  i_d1 ===  i_d2  ? 0 :
          i_d1 >    i_d2  ? 1 :
                            -1

}