// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

import pageScript from "../shared/TokenSigningPageScript";
import patchHwcrypto from "../shared/HwcryptoPatcher";

pageScript();
patchHwcrypto();
