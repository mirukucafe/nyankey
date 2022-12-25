import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
	const salt = await bcrypt.genSalt(8);
	return await bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
	return await bcrypt.compare(password, hash);
}
