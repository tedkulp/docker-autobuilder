import { Injectable } from '@nestjs/common';
import { ConfigService as BaseConfigService } from '@nestjs/config';
import { ConfigCredentials } from 'src/types';

@Injectable()
export class ConfigService {
  constructor(private baseConfigService: BaseConfigService) {}

  get<T = any>(propertyPath: string, defaultValue?: T) {
    return this.baseConfigService.get<T>(propertyPath, defaultValue);
  }

  getCredentials(section?: 'github' | 'apprise' | 'docker_hub') {
    const baseCreds =
      this.baseConfigService.get<ConfigCredentials>('credentials');
    return section ? baseCreds[section] : baseCreds;
  }
}
