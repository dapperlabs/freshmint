import { Command, Argument } from 'commander';
import chalk from 'chalk';

import { loadConfig } from '../config';
import { generateNextjsApp, generateProjectCadence } from '../generate';

const targets = ['cadence', 'web'];

export default new Command('regen')
  .addArgument(new Argument('<targets...>', 'targets to regenerate').choices(targets))
  .description('regenerate project files from config')
  .action(regen);

async function regen(targets: string[]) {
  const config = await loadConfig();

  for (const target of targets) {
    switch (target) {
      case 'cadence':
        await generateProjectCadence('./', config.contract, false);
        console.log(`Regenerated files in ${chalk.cyan('./cadence')}`);
        break;
      case 'web':
        await generateNextjsApp('./', config.collection.name, config.collection.description);
        console.log(`Regenerated files in ${chalk.cyan('./web')}`);
        break;
    }
  }
}
