import { supabase } from './client';

export async function saveCalculation(
  userId: string,
  calculationType: string,
  inputData: any,
  resultData: any
) {
  const { data, error } = await supabase
    .from('saved_calculations')
    .insert({
      user_id: userId,
      calculation_type: calculationType,
      input_data: inputData,
      result_data: resultData
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving calculation:", error);
    throw error;
  }
  
  return data;
}
