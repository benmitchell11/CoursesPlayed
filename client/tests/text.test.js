import { foldText } from '../src/lib/text'

describe('foldText', () => {
  test('drops macrons and other accents, case and apostrophes', () => {
    expect(foldText('Ōtaki')).toBe('otaki')
    expect(foldText('Whakatāne Golf Club')).toBe('whakatane golf club')
    expect(foldText('Ōpōtiki')).toBe('opotiki')
    expect(foldText("Jack's Point")).toBe('jacks point')
    expect(foldText('Jack’s Point')).toBe('jacks point')
  })

  test('treats a typed macron and a missing one as the same', () => {
    expect(foldText('Otaki')).toBe(foldText('Ōtaki'))
  })

  test('copes with empty and missing values', () => {
    expect(foldText('  ')).toBe('')
    expect(foldText(null)).toBe('')
    expect(foldText(undefined)).toBe('')
  })
})
