import { homedir, tmpdir } from 'os';
import { getUserDataPath } from './userDataPath.js';
import { AbstractNativeEnvironmentService } from '../common/environmentService.js';
import { NativeParsedArgs } from '../common/argv.js';
import { IProductService } from '../../product/common/productService.js';

export class NativeEnvironmentService extends AbstractNativeEnvironmentService {

	constructor(args: NativeParsedArgs, productService: IProductService) {
		super(args, {
			homeDir: homedir(),
			tmpDir: tmpdir(),
			userDataDir: getUserDataPath('suite')
		}, productService)
	}
}
