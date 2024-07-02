interface IUtxo {
  txid: string;
  vout: number;
  value: number;
}

export const getSendBTCUTXOArray = (
  utxoArray: Array<IUtxo>,
  amount: number
) => {
  let utxoSum = 0;
  let iterator = 0;
  let newUtxoArray: Array<IUtxo> = [];
  let filteredUtxoArray = utxoArray.filter((utxo) => utxo.value > 1000);
  let filteredSum = filteredUtxoArray.reduce(
    (accum: number, utxo: IUtxo) => accum + utxo.value,
    0
  );
  if (filteredSum < amount) {
    return { isSuccess: false, data: newUtxoArray };
  }
  while (utxoSum <= amount) {
    utxoSum += filteredUtxoArray[iterator].value;
    newUtxoArray.push(filteredUtxoArray[iterator]);
    iterator++;
  }
  return { isSuccess: true, data: newUtxoArray };
};
