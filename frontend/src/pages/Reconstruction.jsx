import React from "react";
import ConnectionStatus from "../components/common/ConnectionStatus";

import { Zap,} from 'lucide-react';
import FormButton from "../components/common/FormButton";
export default function Reconstruction() {
  return (
    <>
      <ConnectionStatus icon={Zap}  />
      <FormButton variant="secondary"/>
    </>
  );
}
