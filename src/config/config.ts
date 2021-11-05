import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';

const YAML_CONFIG_FILENAME = 'config.yaml';

export default () => {
  //TODO: This most likely needs to be fixed
  const filename = join(__dirname, '..', '..', 'config', YAML_CONFIG_FILENAME);

  return yaml.load(readFileSync(filename, 'utf8')) as Record<string, any>;
};
