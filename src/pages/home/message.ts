export const hostMessage = (
  names: string[],
  index: number,
  unfair: boolean,
  base: string
): string => {
  const winner = names[index]
  const rest = names.filter((name) => {
    return name.toLocaleLowerCase() !== winner.toLocaleLowerCase()
  })

  if (names.length === 2) {
    const other = names.find((_, nameIndex) => nameIndex !== index)
    return `@${winner} will be the next host!\nThe day after tomorrow's winner is ${other ?? ''}\nNew wheel: ${base}?names=`
  }

  const next = rest.map((name) => encodeURIComponent(name)).join(',')
  const mode = unfair ? '&unfairMode=true' : ''
  return `@${winner} will be the next host!\nNew wheel: ${base}?names=${next}${mode}`
}
