import { validatePassword } from '../../src/services/passwordPolicy';

describe('validatePassword', () => {
  it('accepts a strong password', () => {
    // given
    const password = 'Str0ng!Pass';

    // when
    const result = validatePassword(password);

    // then
    expect(result).toEqual({ ok: true });
  });

  it.each([
    ['too short', 'Ab1!', /at least 8/],
    ['repetitive', 'aaaaaaaa', /repetitive/],
    ['common (lowercase)', 'password1', /too common/],
    ['common (uppercase)', 'PASSWORD1', /too common/],
    ['missing an uppercase letter', 'alllowercase1!', /uppercase/],
    ['missing a lowercase letter', 'ALLUPPERCASE1!', /uppercase/],
    ['missing a number', 'NoNumbers!!', /uppercase/],
    ['missing a special character', 'NoSpecial123', /uppercase/],
  ])('rejects a password that is %s', (_label, password, reasonPattern) => {
    // when
    const result = validatePassword(password as string);

    // then
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(reasonPattern as RegExp);
  });
});
