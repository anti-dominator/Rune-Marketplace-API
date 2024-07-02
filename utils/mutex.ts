import { flagMutex, iterator } from "..";
import app from "..";

// Set flag variable for Unisat API rate limit overcoming
export const setUtxoFlag = async (value: number) => {
  const release = await flagMutex.acquire();
  try {
    // Perform actions with the flag variable
    app.locals.utxoflag = value;
  } finally {
    release();
  }
};

// Wait flag variable until false for 200ms for Unisat API rate limit overcoming
export async function waitUtxoFlag() {
  return new Promise<void>((resolve, reject) => {
    let intervalId: any;
    const checkForUtxo = async () => {
      try {
        if (!app.locals.utxoflag) {
          resolve();
          clearInterval(intervalId);
        }
      } catch (error) {
        reject(error);
        clearInterval(intervalId);
      }
    };
    intervalId = setInterval(checkForUtxo, 200);
  });
}

// Set Unisat API Iterator global variable using Mutex module
export const setApiIterator = async (value: number) => {
  const release = await iterator.acquire();
  try {
    // Perform actions with the flag variable
    app.locals.iterator = value;
  } finally {
    release();
  }
};
