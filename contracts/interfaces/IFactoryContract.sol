// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
interface IFactoryContract {
    function getPauseAllStatus() external view returns (bool);
}