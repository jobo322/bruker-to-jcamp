'use strict';

const { join } = require('path');
const { writeFileSync } = require('fs');
const { fileListFromPath } = require('filelist-utils');
const { convertFileList, groupByExperiments } = require('brukerconverter');
const { fromVariables } = require('convert-to-jcamp');
const { xMultiply } = require('ml-spectra-processing');

const pathToWrite = '';
const pathToRead = '';

const converterOptions = {
  converter: { xy: true },
  filter: {
    // experimentNumber: [120, 121, 122],
    onlyFirstProcessedData: true,
    ignoreFID: true,
    ignore2D: true,
  },
};

(async () => {
  const fileList = fileListFromPath(pathToRead);
  const experiments = groupByExperiments(fileList, converterOptions.filter);
  for (const expno of experiments) {
    const spectra = await convertFileList(expno.fileList);

    for (const spectrum of spectra) {
      const { source } = spectrum;
      if (source.is1D && !source.isFID) {
        const { info, meta, spectra } = spectrum;
        const { observeFrequency, nucleus, data } = spectra[0];
        const options = {
          xyEncoding: 'DIFDUP',
          info: {
            title: info.TITLE,
            owner: info.OWNER,
            origin: info.ORIGIN,
            dataType: meta.DATATYPE,
            '.OBSERVE FREQUENCY': observeFrequency,
            '.OBSERVE NUCLEUS': nucleus[0],
          },
          meta,
          isXYData: true,
          isNMR: true,
        };

        const variables = {
          x: {
            data: xMultiply(data.x, observeFrequency),
            label: 'Hz',
            name: 'frequencies',
            units: 'Hz',
            symbol: 'X',
            isDependent: false,
          },
          r: {
            data: data.re,
            label: 'real',
            units: 'arbitratry units',
            name: 'rfrequeeal',
            symbol: 'R',
            isDependent: true,
          },
          i: {
            data: data.im,
            label: 'imaginary',
            units: 'arbitratry units',
            name: 'imaginary',
            symbol: 'I',
            isDependent: true,
          },
        };
        const jcamp = fromVariables(variables, options);
        writeFileSync(join(pathToWrite,`${source.name}_${source.expno}.jdx`), jcamp);
      }
    }
  }
})();
