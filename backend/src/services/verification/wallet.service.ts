import { VerificationProvider, VerificationResult } from './types';
import prisma from '../../utils/prismaClient';
import { ethers } from 'ethers';

export class WalletService implements VerificationProvider {
  private rpcUrl: string;
  private chainId: number;
  private provider: ethers.JsonRpcProvider | null = null;

  constructor() {
    this.rpcUrl = process.env.WALLET_RPC_URL || '';
    this.chainId = parseInt(process.env.WALLET_CHAIN_ID || '1');
    
    // Initialize provider if RPC is configured
    if (this.rpcUrl) {
      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
    }
  }

  async verify(
    userId: string,
    taskId: string,
    verificationData: any,
    userMetadata?: any
  ): Promise<VerificationResult> {
    const { action, contractAddress, tokenId, amount, walletAddress, signature, message } = verificationData;

    // If no real RPC configured, return unsupported (production honest verification)
    if (!this.rpcUrl || !this.provider) {
      return {
        success: false,
        message: 'Wallet provider is not configured. Verification is unsupported.',
        unsupported: true
      };
    }

    try {
      switch (action) {
        case 'connect':
          return await this.verifyWalletConnection(userId, walletAddress, signature, message);
        case 'hold_token':
          return await this.verifyTokenHolding(userId, contractAddress, amount, walletAddress);
        case 'nft_ownership':
          return await this.verifyNFTOwnership(userId, contractAddress, tokenId, walletAddress);
        case 'transaction':
          return await this.verifyTransaction(userId, verificationData.txHash, walletAddress);
        default:
          return {
            success: false,
            message: 'Acción de wallet no soportada'
          };
      }
    } catch (error) {
      console.error('Wallet verification error:', error);
      return {
        success: false,
        message: 'Error verificando wallet. Intenta de nuevo.'
      };
    }
  }

  /**
   * Verify wallet connection using EIP-191 message signature
   * User must sign a specific message to prove wallet ownership
   */
  private async verifyWalletConnection(
    userId: string,
    walletAddress: string,
    signature?: string,
    message?: string
  ): Promise<VerificationResult> {
    if (!walletAddress) {
      return {
        success: false,
        message: 'Se requiere dirección de wallet'
      };
    }

    // Validate Ethereum address format
    if (!ethers.isAddress(walletAddress)) {
      return {
        success: false,
        message: 'Dirección de wallet inválida'
      };
    }

    // For connection verification, we need a signature
    if (!signature || !message) {
      return {
        success: false,
        message: 'Se requiere firma de mensaje para verificar propiedad'
      };
    }

    try {
      // Verify the signature using EIP-191 standard
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      const normalizedWallet = ethers.getAddress(walletAddress);
      const normalizedRecovered = ethers.getAddress(recoveredAddress);

      if (normalizedWallet !== normalizedRecovered) {
        return {
          success: false,
          message: 'La firma no coincide con la dirección de wallet proporcionada'
        };
      }

      // Store wallet connection in database
      await prisma.user.update({
        where: { id: userId },
        data: {
          walletAddress: normalizedWallet,
          walletChain: this.chainId.toString(),
          walletConnectedAt: new Date()
        }
      });

      return {
        success: true,
        message: '¡Wallet conectada y verificada exitosamente!',
        externalId: normalizedWallet,
        metadata: {
          connectedAt: new Date().toISOString(),
          chainId: this.chainId,
          walletAddress: normalizedWallet
        }
      };
    } catch (error) {
      console.error('Signature verification failed:', error);
      return {
        success: false,
        message: 'No se pudo verificar la firma. Asegúrate de que sea válida.'
      };
    }
  }

  /**
   * Verify user holds minimum token balance
   */
  private async verifyTokenHolding(
    userId: string,
    contractAddress: string,
    requiredAmount: string,
    walletAddress?: string
  ): Promise<VerificationResult> {
    if (!walletAddress) {
      return {
        success: false,
        message: 'Se requiere dirección de wallet'
      };
    }

    if (!ethers.isAddress(walletAddress)) {
      return {
        success: false,
        message: 'Dirección de wallet inválida'
      };
    }

    if (!ethers.isAddress(contractAddress)) {
      return {
        success: false,
        message: 'Dirección de contrato inválida'
      };
    }

    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      // ERC20 ABI for balanceOf
      const erc20Abi = [
        'function balanceOf(address owner) public view returns (uint256)',
        'function decimals() public view returns (uint8)'
      ];

      const contract = new ethers.Contract(contractAddress, erc20Abi, this.provider);

      // Get token decimals
      const decimals = await contract.decimals();
      
      // Get balance
      const balance = await contract.balanceOf(walletAddress);
      
      // Convert required amount to BigNumber with correct decimals
      const requiredBigNum = ethers.parseUnits(requiredAmount.toString(), decimals);

      if (balance >= requiredBigNum) {
        return {
          success: true,
          message: `¡Balance verificado! Tienes ${ethers.formatUnits(balance, decimals)} tokens.`,
          externalId: walletAddress,
          metadata: {
            balance: balance.toString(),
            balanceFormatted: ethers.formatUnits(balance, decimals),
            requiredAmount: requiredAmount.toString(),
            contractAddress,
            verifiedAt: new Date().toISOString()
          }
        };
      } else {
        return {
          success: false,
          message: `Balance insuficiente. Tienes ${ethers.formatUnits(balance, decimals)} tokens, se requieren ${requiredAmount}.`
        };
      }
    } catch (error) {
      console.error('Token balance verification failed:', error);
      return {
        success: false,
        message: 'No se pudo verificar el balance. Intenta de nuevo.'
      };
    }
  }

  /**
   * Verify user owns specific NFT
   */
  private async verifyNFTOwnership(
    userId: string,
    contractAddress: string,
    tokenId: string,
    walletAddress?: string
  ): Promise<VerificationResult> {
    if (!walletAddress) {
      return {
        success: false,
        message: 'Se requiere dirección de wallet'
      };
    }

    if (!ethers.isAddress(walletAddress)) {
      return {
        success: false,
        message: 'Dirección de wallet inválida'
      };
    }

    if (!ethers.isAddress(contractAddress)) {
      return {
        success: false,
        message: 'Dirección de contrato inválida'
      };
    }

    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      // ERC721 ABI for ownerOf
      const erc721Abi = [
        'function ownerOf(uint256 tokenId) public view returns (address owner)'
      ];

      const contract = new ethers.Contract(contractAddress, erc721Abi, this.provider);

      // Get NFT owner
      const owner = await contract.ownerOf(tokenId);
      const normalizedWallet = ethers.getAddress(walletAddress);
      const normalizedOwner = ethers.getAddress(owner);

      if (normalizedWallet === normalizedOwner) {
        return {
          success: true,
          message: '¡NFT verificado exitosamente!',
          externalId: walletAddress,
          metadata: {
            tokenId,
            contractAddress,
            ownedSince: new Date().toISOString()
          }
        };
      } else {
        return {
          success: false,
          message: 'No se detecta ownership de este NFT en tu wallet.'
        };
      }
    } catch (error) {
      console.error('NFT ownership verification failed:', error);
      return {
        success: false,
        message: 'No se pudo verificar ownership del NFT. Verifica el ID del token.'
      };
    }
  }

  /**
   * Verify transaction existence and confirmation
   */
  private async verifyTransaction(
    userId: string,
    txHash: string,
    walletAddress?: string
  ): Promise<VerificationResult> {
    if (!walletAddress || !txHash) {
      return {
        success: false,
        message: 'Se requieren dirección de wallet y hash de transacción'
      };
    }

    if (!ethers.isAddress(walletAddress)) {
      return {
        success: false,
        message: 'Dirección de wallet inválida'
      };
    }

    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      // Get transaction details
      const tx = await this.provider.getTransaction(txHash);

      if (!tx) {
        return {
          success: false,
          message: 'Transacción no encontrada'
        };
      }

      // Get transaction receipt to check confirmation
      const receipt = await this.provider.getTransactionReceipt(txHash);

      if (!receipt) {
        return {
          success: false,
          message: 'Transacción no ha sido confirmada aún'
        };
      }

      const normalizedWallet = ethers.getAddress(walletAddress);
      const normalizedFrom = ethers.getAddress(tx.from);
      const normalizedTo = ethers.getAddress(tx.to || '0x');

      // Check if user is sender or receiver
      const isParticipant = normalizedWallet === normalizedFrom || normalizedWallet === normalizedTo;

      if (isParticipant) {
        return {
          success: true,
          message: '¡Transacción verificada exitosamente!',
          externalId: walletAddress,
          metadata: {
            txHash,
            blockNumber: receipt.blockNumber,
            confirmations: (await this.provider.getBlockNumber()) - receipt.blockNumber,
            confirmedAt: new Date().toISOString(),
            isFrom: normalizedWallet === normalizedFrom,
            isTo: normalizedWallet === normalizedTo
          }
        };
      } else {
        return {
          success: false,
          message: 'Tu wallet no está asociada a esta transacción'
        };
      }
    } catch (error) {
      console.error('Transaction verification failed:', error);
      return {
        success: false,
        message: 'No se pudo verificar la transacción'
      };
    }
  }
}