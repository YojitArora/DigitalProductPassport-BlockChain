import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PassportRegistryModule", (m) => {
  const passportRegistry = m.contract("PassportRegistry");
  return { passportRegistry };
});
