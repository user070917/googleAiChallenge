import crypto from 'crypto';

// Pepper: 환경 변수에서 가져오거나, 없으면 기본값을 사용합니다. (실무에서는 반드시 복잡한 환경변수를 사용하세요)
const PEPPER = process.env.PASSWORD_PEPPER || 'AI_SENIOR_SUPER_SECRET_PEPPER_KEY_2026';

export interface PasswordHashResult {
  salt: string;
  hash: string;
}

/**
 * 비밀번호를 Salt와 Pepper를 사용하여 안전하게 해시합니다.
 */
export function hashPassword(password: string): PasswordHashResult {
  // 1. 랜덤 Salt 생성 (16바이트)
  const salt = crypto.randomBytes(16).toString('hex');
  
  // 2. 비밀번호와 Pepper 결합
  const passwordWithPepper = password + PEPPER;
  
  // 3. 강력한 scrypt 알고리즘을 사용하여 해싱 (64바이트 길이)
  const hash = crypto.scryptSync(passwordWithPepper, salt, 64).toString('hex');
  
  return { salt, hash };
}

/**
 * 입력된 비밀번호가 저장된 해시와 일치하는지 검증합니다.
 */
export function verifyPassword(password: string, storedHash: string, storedSalt: string): boolean {
  // 1. 입력된 비밀번호와 동일한 Pepper 결합
  const passwordWithPepper = password + PEPPER;
  
  // 2. 저장된 Salt를 사용하여 해시 계산
  const computedHash = crypto.scryptSync(passwordWithPepper, storedSalt, 64).toString('hex');
  
  // 3. 시간차 공격(Timing Attack) 방지를 위해 타이밍 안전 비교 수행
  // (길이가 다르면 에러가 날 수 있으므로 먼저 길이 확인)
  if (computedHash.length !== storedHash.length) return false;
  
  return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(storedHash, 'hex'));
}
